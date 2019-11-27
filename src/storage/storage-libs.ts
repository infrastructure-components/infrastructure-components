
export const uploadFile = (
    storageId: string,
    file,
    onProgess: (uploaded: number) => Boolean,
    onComplete: (uri: string) => void,
    onError: (err: string) => void
) => {


    if (!file) {
        onError("not a valid file!");
        return;
    }


    const slice_size = 100 * 1024;
    const reader = new FileReader();

    function upload_file( start, part ) {

        const next_slice = start + slice_size + 1;
        const totalParts = Math.ceil(file.size / slice_size);

        const blob = file.slice( start, next_slice );


        reader.onload = function( event ) {
            if ( event.target.readyState !== FileReader.DONE ) {
                return;
            }

            require("infrastructure-components").callService(
                storageId,
                {
                    file_data: event.target.result,
                    file: file.name,
                    file_type: file.type,
                    part: part,
                    total_parts: totalParts
                },
                (data: any) => {

                    data.json().then(parsedBody => {
                        //console.log("parsedBody: ", parsedBody);

                        const size_done = start + slice_size;

                        if ( next_slice < file.size ) {
                            if (onProgess(size_done)) {
                                // More to upload, call function recursively
                                upload_file( next_slice, part+1 );
                            } else {
                                onError("cancelled");
                            }

                        } else {
                            // Update upload progress
                            onComplete(parsedBody.uri);
                        }
                    });





                },
                (error) => {
                    onError(error);
                }
            );

        };

        reader.readAsDataURL( blob );
    }

    upload_file(0, 0);

};